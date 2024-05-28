FROM public.ecr.aws/lambda/nodejs:20

COPY package*.json ./
RUN npm install
COPY . .

CMD ["app.lambdaHandler"]
