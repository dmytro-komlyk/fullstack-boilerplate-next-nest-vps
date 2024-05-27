import { Injectable, NotFoundException } from '@nestjs/common';

import { Example } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { updateExampleSchema } from './schemas/example.schema';

@Injectable()
export class ExampleService {
  constructor(private prisma: PrismaService) {}

  public async findAll(): Promise<Example[]> {
    return await this.prisma.example.findMany({});
  }

  public async findById(id: string): Promise<Example> {
    const example = await this.prisma.example.findUnique({
      where: { id },
    });

    if (!example) {
      throw new NotFoundException(`Brand with ID "${id}" was not found`);
    }

    return example;
  }

  public async update(data: updateExampleSchema): Promise<Example> {
    const { id, ...newData } = data;
    const example = await this.findById(id);

    if (!example) {
      throw new NotFoundException(`Example with ID ${id} was not found`);
    }

    const updatedExample = await this.prisma.example.update({
      where: { id },
      data: newData,
    });

    return updatedExample;
  }
}
