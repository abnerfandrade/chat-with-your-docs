import { TextDecoder, TextEncoder } from "node:util";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { BroadcastChannel } from "node:worker_threads";
import "whatwg-fetch";

const polyfilledGlobal = globalThis as Record<string, unknown>;

polyfilledGlobal.TextEncoder = TextEncoder;
polyfilledGlobal.TextDecoder = TextDecoder;
polyfilledGlobal.ReadableStream = ReadableStream;
polyfilledGlobal.WritableStream = WritableStream;
polyfilledGlobal.TransformStream = TransformStream;
polyfilledGlobal.BroadcastChannel = BroadcastChannel;
