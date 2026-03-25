FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ ./
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build

FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./frontend/build

EXPOSE 8000

WORKDIR /app/backend
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
