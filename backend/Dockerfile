# Backend Dockerfile for Spring Boot
FROM eclipse-temurin:17-jdk-slim

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Build the application
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Copy the built jar
RUN cp target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application with dynamic port from environment
CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
