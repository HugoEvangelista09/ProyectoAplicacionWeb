FROM ubuntu:latest
LABEL authors="Miguel"

ENTRYPOINT ["top", "-b"]