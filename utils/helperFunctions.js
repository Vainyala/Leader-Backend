// Get IST Date
const getISTDate = () => {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;  // IST offset in milliseconds

  //console.log('getISTDate: Current Time: ', now, ' IST: ', new Date(now.getTime() + offset));
  
  return new Date(now.getTime() + offset);
};

module.exports = { getISTDate };