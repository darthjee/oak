FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/production_taa:1.5.0 as base

######################################

FROM base as builder

COPY Gemfile* /home/app/app/
COPY package.json /home/app/app/

ENV HOME_DIR /home/app

USER root
COPY --chown=app:app --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh
USER app

COPY --chown=app:app --from=scripts /home/scripts/builder/bundle_builder.sh /usr/local/sbin/bundle_builder.sh
RUN /bin/bash bundle_builder.sh --without development test

#######################
#FINAL IMAGE
FROM base

COPY --chown=app:app --from=builder /home/app/bundle/ /usr/local/bundle/
COPY --chown=app:app --from=builder /home/app/yarn/new/ /usr/local/share/.cache/yarn/v6/
