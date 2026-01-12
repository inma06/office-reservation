import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

export interface PaginatedRoomsResult {
  data: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedRoomsResult> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.roomRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { id } });
  }

  async create(roomData: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(roomData);
    return this.roomRepository.save(room);
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('회의실을 찾을 수 없습니다.');
    }

    Object.assign(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async delete(id: number): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('회의실을 찾을 수 없습니다.');
    }

    await this.roomRepository.remove(room);
  }
}

