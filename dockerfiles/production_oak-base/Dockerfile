FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/production_taa:1.5.0 as base

######################################

FROM base as builder

COPY Gemfile* /home/app/app/

ENV HOME_DIR /home/app

COPY --chown=app:app --from=scripts /home/scripts/builder/bundle_builder.sh /usr/local/sbin/bundle_builder.sh
RUN bundle config set without 'development test'
RUN /bin/bash bundle_builder.sh

#######################
#FINAL IMAGE
FROM base

COPY --chown=app:app --from=builder /home/app/bundle/ /usr/local/bundle/
