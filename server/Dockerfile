ARG GO_VERSION=1.26
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN go build -v -o /run-app ./cmd/api/

FROM debian:bookworm

COPY --from=builder /usr/src/app/migrations /usr/local/bin/migrations

COPY --from=builder /run-app /usr/local/bin/
CMD ["run-app"]