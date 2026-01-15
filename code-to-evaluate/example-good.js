/**
 * User management service with good code practices
 * This file demonstrates code that should score well against the baseline criteria
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validateEmail, validatePassword } from './validators.js';
import { UserRepository } from './repositories/UserRepository.js';
import { Logger } from './utils/Logger.js';

/**
 * UserService handles user authentication and management
 */
export class UserService {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger || new Logger('UserService');
    this.saltRounds = 10;
  }

  /**
   * Registers a new user with validated credentials
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @param {string} userData.name - User's full name
   * @returns {Promise<Object>} Created user object (without password)
   * @throws {ValidationError} If input validation fails
   * @throws {ConflictError} If user already exists
   */
  async registerUser(userData) {
    try {
      // Input validation
      if (!validateEmail(userData.email)) {
        throw new ValidationError('Invalid email format');
      }

      if (!validatePassword(userData.password)) {
        throw new ValidationError(
          'Password must be at least 8 characters with uppercase, lowercase, and number'
        );
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password securely
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

      // Create user in database
      const newUser = await this.userRepository.create({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        createdAt: new Date(),
        isVerified: false
      });

      // Log successful registration
      this.logger.info(`New user registered: ${newUser.id}`);

      // Return user without sensitive data
      return this.sanitizeUser(newUser);

    } catch (error) {
      this.logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticates user and returns JWT token
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Authentication token and user data
   * @throws {AuthenticationError} If credentials are invalid
   */
  async loginUser(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new AuthenticationError('Email and password are required');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateAuthToken(user);

      // Update last login timestamp
      await this.userRepository.updateLastLogin(user.id);

      this.logger.info(`User logged in: ${user.id}`);

      return {
        token,
        user: this.sanitizeUser(user)
      };

    } catch (error) {
      this.logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * Generates JWT authentication token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateAuthToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'user-service'
    });
  }

  /**
   * Removes sensitive data from user object
   * @param {Object} user - User object with all data
   * @returns {Object} User object without sensitive data
   */
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}