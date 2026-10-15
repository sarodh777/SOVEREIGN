# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build production jar skipping tests
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root system user for security
RUN addgroup -S vaultchain && adduser -S vaultchain -G vaultchain

# Copy JAR from builder stage
COPY --from=builder /app/target/ledger-0.0.1-SNAPSHOT.jar app.jar

# Set ownership
RUN chown -R vaultchain:vaultchain /app
USER vaultchain

# Expose standard port (overridden by Render PORT env)
EXPOSE 8080

# Environment defaults
ENV PORT=8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Launch Spring Boot
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
