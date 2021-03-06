import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { JWT_SECRET } from '@common/constants/envs'
import { BadRequestError, NotFoundError } from '@common/errors/http.errors'
import { JUser } from '@common/models'

import { LoginDto } from '@modules/users/dtos'
import { UserRepository } from '@modules/users/repositories'

import { User } from '../../models'

export class LoginUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: LoginDto): Promise<{ user: Omit<User, 'password'>; token: string }> {
    const { email, password } = input

    const foundUser = await this.userRepository.findByEmail(email)

    if (!foundUser) {
      throw NotFoundError('User not found.')
    }

    const { id, name, password: hashedPassword, avatarUrl, ...userWithoutPassword } = foundUser

    const comparedPassword = await bcrypt.compare(password, hashedPassword)

    if (!comparedPassword) {
      throw BadRequestError('Wrong password.')
    }

    const token = jwt.sign(
      {
        id,
        name,
        email,
        avatarUrl
      } as JUser,
      JWT_SECRET,
      {
        issuer: 'metafy',
        expiresIn: '7d'
      }
    )

    return {
      user: { id, name, avatarUrl, ...userWithoutPassword },
      token
    }
  }
}
