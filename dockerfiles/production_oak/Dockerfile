FROM darthjee/production_oak-base:0.1.1 as base

####################################

FROM base as builder

COPY --chown=app:app ./ /home/app/app/

RUN bundle config set without 'development test'
RUN bundle install

RUN rm /home/app/app/config/master.key -f
RUN rm /home/app/app/config/credentials.yml.enc -f
RUN rm /home/app/app/public/assets/* -rf
RUN rm /home/app/app/spec -rf
RUN EDITOR=none rails credentials:edit
RUN rm /home/app/app/log/* -f
RUN rm /home/app/app/tmp/* -rf

##################################

FROM base

COPY --chown=app:app --from=builder /home/app/app/ /home/app/app/

RUN bundle config set without 'development test'
RUN bundle install
