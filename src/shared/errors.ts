/**
 * This error class has the purpose of being catch-able
 * on the backend where it can be turned into a TRPCError BAD_REQUEST with the message
 * sent to the client whereas all other errors don't have their message sent to the client.
 *
 * It's also unrelated to tRPC so that all the match logic code doesn't rely on any
 * I/O concept like tRPC.
 *
 * So the handling of how these errors are treated is pushed up to the backend procedure or client layers.
 * The only intent of this error is that the message can be known by the client, which doesn't
 * matter if the error came from processing match logic on the client in the first place.
 */
export class DispatchableError extends Error {}

/**
 * for errors that *should* never occur if other code is correct.
 * in other words: the program should have not gotten to this point, some other check is missing or incorrect.
 */
export class InvalidStateError extends DispatchableError {}

/**
 * for errors that are caused by the player doing an illegal action,
 * such as trying to move a unit that doesn't belong to them, or trying to attack a unit that is out of range.
 */
export class IllegalActionError extends DispatchableError {}
