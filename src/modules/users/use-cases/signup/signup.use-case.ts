import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { JWT_SECRET } from '@common/constants/envs'
import { BadRequestError } from '@common/errors/http.errors'
import { JUser } from '@common/models'

import { SignUpDto } from '../../dtos'
import { User } from '../../models'
import { UserRepository } from '../../repositories'

export class SignUpUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SignUpDto): Promise<{ user: Omit<User, 'password'>; token: string }> {
    const { email, name, password, confirmPassword, birth, ...userInput } = input

    const numberOfEmails = await this.userRepository.exists({ email })

    if (numberOfEmails) {
      throw BadRequestError('This user already exists.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const createdUser = await this.userRepository.save({
      email,
      name,
      password: hashedPassword,
      birth: new Date(birth),
      ...userInput
    })

    const { id, password: createdPassword, avatarUrl, ...userWithoutPassword } = createdUser

    const signedToken = jwt.sign(
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
      user: { id, ...userWithoutPassword },
      token: signedToken
    }
  }
}
