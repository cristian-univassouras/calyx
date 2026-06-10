FROM node:20-alpine

WORKDIR /app

# URL da API embutida no build (o navegador acessa por aqui)
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview"]
