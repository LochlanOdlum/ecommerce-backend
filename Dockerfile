FROM public.ecr.aws/lambda/nodejs:20

COPY package.json .

COPY package-lock.json .  

RUN npm install 

COPY . . 

CMD [ "app.handler" ]

