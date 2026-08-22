import 'dotenv/config';
import { PrismaClient, NodeType, ShareMode } from '../src/generated/prisma/client';
import { S3Client, PutObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://dataroom:dataroom@localhost:5432/dataroom' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});
const bucket = process.env.S3_BUCKET || 'dataroom';

async function seed() {
  const email = process.env.SEED_DEMO_EMAIL || 'demo@example.com';
  const password = process.env.SEED_DEMO_PASSWORD || 'demodemo1';
  const dataRoomName = "Demo's Data Room";

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { dataRooms: true },
  });

  if (existingUser) {
    const hasDataRoom = existingUser.dataRooms.some((r) => r.name === dataRoomName);
    if (!hasDataRoom) {
      console.error(`User ${email} exists but does not have a data room named "${dataRoomName}".`);
      process.exit(1);
    }
    console.log(`Demo seed already applied for ${email}. Skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(password);

  console.log(`Seeding demo data for ${email}...`);

  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch {
    // Ignore all bucket creation errors (e.g. already exists, unsupported api call)
  }

  // We need to generate IDs for files beforehand so we can create S3 stubs
  const financialSummaryId = crypto.randomUUID();
  const revenueForecastId = crypto.randomUUID();
  const ndaDraftId = crypto.randomUUID();
  const acmeLogoId = crypto.randomUUID();

  // Create zero-byte S3 stubs
  // The storage key convention in this app is `{dataRoomId}/{nodeId}`. Wait, let's use what's standard.
  // We need the data room ID beforehand too.
  const dataRoomId = crypto.randomUUID();

  const filesToStub = [
    { id: financialSummaryId, mime: 'application/pdf' },
    { id: revenueForecastId, mime: 'text/csv' },
    { id: ndaDraftId, mime: 'application/pdf' },
    { id: acmeLogoId, mime: 'image/png' },
  ];

  for (const file of filesToStub) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${dataRoomId}/${file.id}`,
        Body: Buffer.from(''),
        ContentType: file.mime,
        ContentLength: 0,
      })
    );
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const dataRoom = await tx.dataRoom.create({
      data: {
        id: dataRoomId,
        name: dataRoomName,
        ownerId: user.id,
      },
    });

    const rootNode = await tx.node.create({
      data: {
        dataRoomId: dataRoom.id,
        name: 'Root', // Or whatever name is appropriate for root, though usually it's unnamed or just the room name. In this model, root has parentId=null.
        type: NodeType.FOLDER,
      },
    });

    const q3Diligence = await tx.node.create({
      data: {
        dataRoomId: dataRoom.id,
        parentId: rootNode.id,
        name: 'Q3 Diligence',
        type: NodeType.FOLDER,
      },
    });

    const q3Legal = await tx.node.create({
      data: {
        dataRoomId: dataRoom.id,
        parentId: q3Diligence.id,
        name: 'Legal',
        type: NodeType.FOLDER,
      },
    });

    const logos = await tx.node.create({
      data: {
        dataRoomId: dataRoom.id,
        parentId: rootNode.id,
        name: 'Logos',
        type: NodeType.FOLDER,
      },
    });

    await tx.node.createMany({
      data: [
        {
          id: financialSummaryId,
          dataRoomId: dataRoom.id,
          parentId: q3Diligence.id,
          name: 'Financial Summary.pdf',
          type: NodeType.FILE,
          sizeBytes: 0,
          mimeType: 'application/pdf',
          storageKey: `${dataRoomId}/${financialSummaryId}`,
        },
        {
          id: revenueForecastId,
          dataRoomId: dataRoom.id,
          parentId: q3Diligence.id,
          name: 'Revenue Forecast.csv',
          type: NodeType.FILE,
          sizeBytes: 0,
          mimeType: 'text/csv',
          storageKey: `${dataRoomId}/${revenueForecastId}`,
        },
        {
          id: ndaDraftId,
          dataRoomId: dataRoom.id,
          parentId: q3Legal.id,
          name: 'NDA Draft.pdf',
          type: NodeType.FILE,
          sizeBytes: 0,
          mimeType: 'application/pdf',
          storageKey: `${dataRoomId}/${ndaDraftId}`,
        },
        {
          id: acmeLogoId,
          dataRoomId: dataRoom.id,
          parentId: logos.id,
          name: 'acme-logo.png',
          type: NodeType.FILE,
          sizeBytes: 0,
          mimeType: 'image/png',
          storageKey: `${dataRoomId}/${acmeLogoId}`,
        },
      ],
    });

    // Create one public Share on Q3 Diligence
    await tx.share.create({
      data: {
        nodeId: q3Diligence.id,
        dataRoomId: dataRoom.id,
        mode: ShareMode.PUBLIC,
        token: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''), // 32 random bytes (approximation here using UUIDs)
      },
    });
  });

  console.log(`Demo seed complete. Room "${dataRoomName}" created for ${email}.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
