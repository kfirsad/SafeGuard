type WorkerRecord = {
  phone: string;
  password: string;
};

const responderDB: WorkerRecord[] = [
  { phone: "0501234567", password: "responder123" },
  { phone: "0529876543", password: "secure456" },
];

export const checkResponderInRemoteDB = async (
  phone: string,
  password: string
): Promise<boolean> => {
  // simulate network delay
  await new Promise((res) => setTimeout(res, 400));

  return responderDB.some(
    (r) => r.phone === phone && r.password === password
  );
};