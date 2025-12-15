const socketToUser = new Map();
const userToSocket = new Map();

function bindSocket(socketId, userId) {
  socketToUser.set(socketId, userId);
  userToSocket.set(userId, socketId);
}

function unbindSocket(socketId) {
  const userId = socketToUser.get(socketId);
  if (userId) {
    userToSocket.delete(userId);
  }
  socketToUser.delete(socketId);
}

function getUserBySocket(socketId) {
  return socketToUser.get(socketId);
}

function getSocketByUser(userId) {
  return userToSocket.get(userId);
}

module.exports = {
  bindSocket,
  unbindSocket,
  getUserBySocket,
  getSocketByUser,
};
