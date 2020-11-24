FROM centos:7 
RUN yum -y update && \
    yum -y install epel-release && \
    yum -y install nodejs && \
    yum -y clean all && \
    curl https://install.meteor.com/ | sh && \
    curl -L -o /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 && \
    chmod +x /usr/local/bin/dumb-init && \
    mkdir /app
WORKDIR /app
EXPOSE 8080
ENV PORT=8080 
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD ["node", "bundle/main.js"]
COPY . .
RUN meteor npm install --save babel-runtime && \
    meteor build . --allow-superuser --directory && \
    (cd bundle/programs/server; npm install)
