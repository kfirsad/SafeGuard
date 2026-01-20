import bcrypt from "bcryptjs";


type WorkerRecord = {
  phone: string;
  passwordHash: string;
  Events: string[];
};

const responderDB: WorkerRecord[] = [
  { phone: "0501234567", passwordHash: bcrypt.hashSync("responder1pass", 10),Events:["18","17","20"] },
  { phone: "0529876543", passwordHash: bcrypt.hashSync("responder2pass", 10),Events:["25","26","27","28"] },
  { phone: "0545555555", passwordHash: bcrypt.hashSync("responder3pass", 10),Events:["15","16","19"] },
];

export const checkResponderInRemoteDB = async (
  phone: string,
  password: string
): Promise<boolean> => {
  // 1. Simulate network delay
  await new Promise((res) => setTimeout(res, 400));

  const responder = responderDB.find((r) => r.phone === phone);
  if (!responder) {
    return false;
  }

  try {
    const match = await bcrypt.compare(password, responder.passwordHash);
    return match;
  } catch (e) {
    return false;
  }
};

export const getResponderByPhone = (phone: string): WorkerRecord | null => {
  const responder = responderDB.find((r) => r.phone === phone);
  return responder || null;
};
