const rooms = new Map();

/*
Room shape:
{
  roomId,
  problemId,
  participants: [userA, userB],
  submissions: {},   // userId -> submissionLink
  winner: null,
  finished: false
}
*/

function createRoom(roomId, problemId, participants) {
  rooms.set(roomId, {
    roomId,
    problemId,
    participants,
    submissions: {},
    winner: null,
    finished: false,
  });
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function submitSolution(roomId, userId, link) {
  const room = rooms.get(roomId);
  if (!room || room.finished) return false;

  room.submissions[userId] = {
    link,
    time: Date.now(),
  };

  return true;
}

function finishRoom(roomId, winner) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.winner = winner;
  room.finished = true;
}

module.exports = {
  createRoom,
  getRoom,
  submitSolution,
  finishRoom,
};
