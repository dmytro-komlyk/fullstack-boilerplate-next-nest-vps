'use client';

import { showToast } from '@/components/Toast';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc, UserSchema } from '@package/api';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FaDiscord, FaSlack, FaTelegram } from 'react-icons/fa6';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

type ProfileFormData = z.infer<typeof UserSchema.updateProfileSchema>;
type IntegrationKey = 'telegramChatId' | 'slackWebhookUrl' | 'discordWebhookUrl';

type IntegrationConfig = {
  key: IntegrationKey;
  name: string;
  Icon: typeof FaTelegram;
  bg: string;
  placeholder: string;
  helperText: string;
  inputLabel: string;
};

const ProfileSettingsPage = () => {
  const t = useTranslations('Common.ProfileSettings');
  const { data: session, update } = useSession();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();

  const [modalKey, setModalKey] = useState<IntegrationKey | null>(null);
  const [modalValue, setModalValue] = useState('');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(UserSchema.updateProfileSchema),
    values: {
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      nickName: profile?.nickName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    },
  });

  const avatarUrlValue = profileForm.watch('avatarUrl');

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      await update({
        ...session,
        user: {
          ...session?.user,
          firstName: data.firstName,
          lastName: data.lastName,
          nickName: data.nickName,
          avatarUrl: data.avatarUrl,
        },
      });
      showToast.success(t('saved'));
    },
    onError: () => {
      showToast.error('An error occurred. Please try again.');
    },
  });

  const updateContacts = trpc.user.updateContacts.useMutation({
    onError: () => {
      showToast.error('An error occurred. Please try again.');
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const openModal = (key: IntegrationKey) => {
    setModalValue(profile?.[key] ?? '');
    setModalKey(key);
  };

  const closeModal = () => setModalKey(null);

  const handleModalSave = () => {
    if (!modalKey) return;
    updateContacts.mutate(
      { [modalKey]: modalValue.trim() || null },
      {
        onSuccess: () => {
          showToast.success(t('saved'));
          utils.user.getProfile.invalidate();
          closeModal();
        },
      }
    );
  };

  const handleDisconnect = (key: IntegrationKey) => {
    updateContacts.mutate(
      { [key]: null },
      {
        onSuccess: () => {
          showToast.success(t('saved'));
          utils.user.getProfile.invalidate();
        },
      }
    );
  };

  const integrations: IntegrationConfig[] = [
    {
      key: 'telegramChatId',
      name: 'Telegram',
      Icon: FaTelegram,
      bg: '#26A5E4',
      placeholder: '123456789',
      inputLabel: t('form.telegramChatId'),
      helperText: t('form.telegramChatIdHelper'),
    },
    {
      key: 'slackWebhookUrl',
      name: 'Slack',
      Icon: FaSlack,
      bg: '#4A154B',
      placeholder: 'https://hooks.slack.com/services/...',
      inputLabel: t('form.slackWebhookUrl'),
      helperText: t('form.slackWebhookUrlHelper'),
    },
    {
      key: 'discordWebhookUrl',
      name: 'Discord',
      Icon: FaDiscord,
      bg: '#5865F2',
      placeholder: 'https://discord.com/api/webhooks/...',
      inputLabel: t('form.discordWebhookUrl'),
      helperText: t('form.discordWebhookUrlHelper'),
    },
  ];

  const activeIntegration = integrations.find((i) => i.key === modalKey);

  if (isLoading) return null;

  return (
    <div className="w-full max-w-2xl">
      <Tabs
        aria-label="Profile settings tabs"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full',
          tab: 'max-w-fit pb-2',
          cursor: 'h-0.5 bg-primary',
          tabContent: 'text-sm font-medium',
        }}
      >
        <Tab key="profile" title={t('tabs.profile')}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                {...(avatarUrlValue ? { src: avatarUrlValue } : {})}
                name={profile?.firstName ?? profile?.email ?? '?'}
                size="lg"
                className="shrink-0 bg-gray-300 dark:bg-navy-600"
              />
              <Input
                {...profileForm.register('avatarUrl')}
                label={t('form.avatarUrl')}
                placeholder="https://example.com/avatar.png"
                variant="bordered"
                size="sm"
                classNames={{
                  inputWrapper:
                    'border-gray-300 dark:border-navy-600 data-[hover]:border-brand-500! data-[focus]:border-brand-500! dark:data-[hover]:border-navy-500',
                }}
                isInvalid={!!profileForm.formState.errors.avatarUrl}
                errorMessage={profileForm.formState.errors.avatarUrl?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                {...profileForm.register('firstName')}
                label={t('form.firstName')}
                variant="bordered"
                classNames={{
                  inputWrapper:
                    'border-gray-300 dark:border-navy-600 data-[hover]:border-brand-500! data-[focus]:border-brand-500! dark:data-[hover]:border-navy-500',
                }}
                isInvalid={!!profileForm.formState.errors.firstName}
                errorMessage={profileForm.formState.errors.firstName?.message}
              />
              <Input
                {...profileForm.register('lastName')}
                label={t('form.lastName')}
                variant="bordered"
                classNames={{
                  inputWrapper:
                    'border-gray-300 dark:border-navy-600 data-[hover]:border-brand-500! data-[focus]:border-brand-500! dark:data-[hover]:border-navy-500',
                }}
                isInvalid={!!profileForm.formState.errors.lastName}
                errorMessage={profileForm.formState.errors.lastName?.message}
              />
            </div>

            <Input
              {...profileForm.register('nickName')}
              label={t('form.nickName')}
              variant="bordered"
              classNames={{
                inputWrapper:
                  'border-gray-300 dark:border-navy-600 data-[hover]:border-brand-500! data-[focus]:border-brand-500! dark:data-[hover]:border-navy-500',
              }}
              isInvalid={!!profileForm.formState.errors.nickName}
              errorMessage={profileForm.formState.errors.nickName?.message}
            />

            <Button
              type="submit"
              color="primary"
              isLoading={updateProfile.isPending}
              className="w-full sm:w-auto"
            >
              {t('save')}
            </Button>
          </form>
        </Tab>

        <Tab key="integrations" title={t('tabs.integrations')}>
          <div className="mt-6 space-y-4">
            {integrations.map(({ key, name, Icon, bg }) => {
              const isConnected = !!profile?.[key];
              return (
                <Card key={key} shadow="sm" className="dark:bg-navy-700">
                  <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon size={20} color="white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{name}</p>
                        {isConnected && (
                          <Chip color="success" size="sm" variant="flat" className="mt-0.5">
                            {t('connected')}
                          </Chip>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isConnected ? (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            className="text-gray-800 dark:text-white bg-gray-100 dark:bg-white/5"
                            onPress={() => openModal(key)}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isLoading={updateContacts.isPending}
                            onPress={() => handleDisconnect(key)}
                          >
                            {t('disconnect')}
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" color="primary" onPress={() => openModal(key)}>
                          {t('connect')}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </Tab>
      </Tabs>

      <Modal
        isOpen={!!modalKey}
        onClose={closeModal}
        size="md"
        className="dark:bg-navy-800"
        classNames={{ closeButton: 'hover:bg-gray-100 dark:hover:bg-navy-700' }}
      >
        <ModalContent>
          {activeIntegration && (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: activeIntegration.bg }}
                >
                  <activeIntegration.Icon size={16} color="white" />
                </div>
                {activeIntegration.name}
              </ModalHeader>
              <ModalBody>
                <Input
                  label={activeIntegration.inputLabel}
                  placeholder={activeIntegration.placeholder}
                  variant="bordered"
                  value={modalValue}
                  onValueChange={setModalValue}
                  autoFocus
                  classNames={{
                    inputWrapper:
                      'border-gray-300 dark:border-navy-600 data-[hover]:border-brand-500! data-[focus]:border-brand-500! dark:data-[hover]:border-navy-500',
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeIntegration.helperText}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  className="bg-gray-100 dark:bg-navy-700"
                  onPress={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={updateContacts.isPending}
                  onPress={handleModalSave}
                >
                  {t('save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProfileSettingsPage;
