declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
	export const WorkerMessageHandler: unknown;
}

declare global {
	// eslint-disable-next-line no-var
	var pdfjsWorker: unknown;
}

export {};
