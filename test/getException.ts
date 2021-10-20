export const getException = async (promise: Promise<unknown>) => {
  try {
    await promise;
    throw new Error(`expected exception was not raised`);
  } catch (ex: any) {
    if (ex.message === "expected exception was not raised") {
      console.log("throwing");
      throw ex;
    }
    console.log(`returning: *${ex.message}*`)
    return ex;
  }
};