FROM darthjee/oak-base:0.1.0

WORKDIR /home/app/app
COPY --chown=app:app Gemfile* /home/app/app/
COPY --chown=app:app package.json /home/app/app/

RUN bundle install
RUN yarn install
