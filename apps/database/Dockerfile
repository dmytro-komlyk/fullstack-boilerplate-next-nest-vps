ARG MONGO_VERSION

FROM mongo:${MONGO_VERSION} As mongo

# we take over the default & start mongo in replica set mode in a background task
ENTRYPOINT mongod --port $MONGO_REPLICA_PORT --replSet rs0 --bind_ip 0.0.0.0 & MONGOD_PID=$!; \
# we prepare the replica set with a single node and prepare the root user config
INIT_REPL_CMD="rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '$MONGO_REPLICA_HOST:$MONGO_REPLICA_PORT' }] })"; \
INIT_USER_CMD="db.getUser('$MONGO_INITDB_ROOT_USERNAME') || db.createUser({ user: '$MONGO_INITDB_ROOT_USERNAME', pwd: '$MONGO_INITDB_ROOT_PASSWORD', roles: [{role: 'readWrite', db: '${MONGO_INITDB_DATABASE}'}] })"; \
# we wait for the replica set to be ready and then submit the command just above
until ($MONGO_COMMAND admin --port $MONGO_REPLICA_PORT --eval "$INIT_REPL_CMD"); do sleep 1; done; \
# Check if the user exists, if not, create the user
$MONGO_COMMAND admin --port $MONGO_REPLICA_PORT --eval "$INIT_USER_CMD" || echo "Error creating user."; \
# we are done but we keep the container by waiting on signals from the mongo task
echo "REPLICA SET ONLINE"; wait $MONGOD_PID;

FROM mongo:${MONGO_VERSION} As mongo-seed

ARG SERVICE_PATH

WORKDIR /data

# Add new seed
COPY ${SERVICE_PATH}/seed/examples.json ./seed/examples.json

COPY apps/database/init-seed.sh ./init-seed.sh
RUN chmod +x /data/init-seed.sh

CMD ["./init-seed.sh"]