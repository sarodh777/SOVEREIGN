# Backend Dockerfile for Spring Boot
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy pom.xml and download dependencies
COPY backend/pom.xml .
COPY backend/mvnw .
COPY backend/.mvn .mvn

# Build the application
COPY backend/src ./src
RUN ./mvnw clean package -DskipTests

# Copy the built jar
RUN cp target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
