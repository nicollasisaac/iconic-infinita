import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import admin from '../config/firebase.config';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  async validate(req: Request): Promise<any> {
    const idToken = req.body?.idToken || req.headers['authorization']?.split('Bearer ')[1];

    if (!idToken) {
      throw new Error('Missing Firebase ID token');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
  }
}
