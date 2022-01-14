#Use Google base image for Node.js
FROM launcher.gcr.io/google/nodejs

#Copy Application code.
COPY . /app/

#Change the working directory in the container
WORKDIR /app 

#Install dependencies
RUN npm install 

#Start the express app
CMD ["node", "server.js"]