const Counter = require("../models/Counter");

async function generateCode(counterKey, prefix, minimumLength = 3) {
  const counter = await Counter.findByIdAndUpdate(
    counterKey,
    {
      $inc: {
        value: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  const numberPart = String(counter.value).padStart(minimumLength, "0");

  return `${prefix}${numberPart}`;
}

module.exports = generateCode;
