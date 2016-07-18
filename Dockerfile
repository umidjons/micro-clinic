FROM node:6
MAINTAINER Umidjons <almatov.us@gmail.com>

WORKDIR /

RUN npm install -g pm2

# copy current directory contents from build context into app directory
COPY . /usr/src/app

WORKDIR /usr/src/app

# pm2 logs
VOLUME /root/.pm2/logs

EXPOSE 3000
CMD ["pm2", "start", "server.js", "-i", "0", "--no-daemon"]

### Build example ######################################################################################################
# cd /home/me/dist/app/                                                                                                #
# docker build -f Dockerfile_node -t ws:1.0 .                                                                          #
### Run example ########################################################################################################
# mkdir /var/log/pm2                                                                                                   #
# docker run -d --name ws --net starmed-network -p 80:3000 -v /var/log/pm2:/root/.pm2/logs ws:1.0                      #
########################################################################################################################
