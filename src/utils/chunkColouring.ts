import ExternalModule from '../ExternalModule';
import Module from '../Module';
import { randomUint8Array, Uint8ArrayXor } from './entryHashing';

export function assignChunkColouringHashes(
	entryModules: Module[],
	manualChunkModules: Record<string, Module[]>
) {
	let currentEntry: Module, currentEntryHash: Uint8Array;
	let modulesVisitedForCurrentEntry: Set<string>;
	const handledEntryPoints: Set<string> = new Set();
	const dynamicImports: Module[] = [];

	const addCurrentEntryColourToModule = (module: Module) => {
		if (currentEntry.manualChunkAlias) {
			module.manualChunkAlias = currentEntry.manualChunkAlias;
			module.entryPointsHash = currentEntryHash;
		} else {
			Uint8ArrayXor(module.entryPointsHash, currentEntryHash);
		}

		for (const dependency of module.dependencies) {
			if (
				dependency instanceof ExternalModule ||
				modulesVisitedForCurrentEntry.has(dependency.id)
			) {
				continue;
			}
			modulesVisitedForCurrentEntry.add(dependency.id);
			if (!handledEntryPoints.has(dependency.id) && !dependency.manualChunkAlias) {
				addCurrentEntryColourToModule(dependency);
			}
		}

		for (const { resolution } of module.dynamicImports) {
			if (
				resolution instanceof Module &&
				resolution.dynamicallyImportedBy.length > 0 &&
				!resolution.manualChunkAlias
			) {
				dynamicImports.push(resolution);
			}
		}
	};

	if (manualChunkModules) {
		for (const chunkName of Object.keys(manualChunkModules)) {
			currentEntryHash = randomUint8Array(10);

			for (currentEntry of manualChunkModules[chunkName]) {
				modulesVisitedForCurrentEntry = new Set(currentEntry.id);
				addCurrentEntryColourToModule(currentEntry);
			}
		}
	}

	for (currentEntry of entryModules) {
		handledEntryPoints.add(currentEntry.id);
		currentEntryHash = randomUint8Array(10);
		modulesVisitedForCurrentEntry = new Set(currentEntry.id);
		if (!currentEntry.manualChunkAlias) {
			addCurrentEntryColourToModule(currentEntry);
		}
	}

	for (currentEntry of dynamicImports) {
		if (handledEntryPoints.has(currentEntry.id)) {
			continue;
		}
		handledEntryPoints.add(currentEntry.id);
		currentEntryHash = randomUint8Array(10);
		modulesVisitedForCurrentEntry = new Set(currentEntry.id);
		addCurrentEntryColourToModule(currentEntry);
	}
}

export function traverseDependencies(currentEntry: Module) {
	// let currentEntryHash: Uint8Array;
	let modulesVisitedForCurrentEntry: { [id: string]: Module };
	// const handledEntryPoints: { [id: string]: boolean } = {};
	// const dynamicImports: Module[] = [];

	const addCurrentEntryColourToModule = (module: Module) => {
		// if (currentEntry.chunkAlias) {
		// 	module.chunkAlias = currentEntry.chunkAlias;
		// // 	module.entryPointsHash = currentEntryHash;
		// // } else {
		// // 	Uint8ArrayXor(module.entryPointsHash, currentEntryHash);
		// }

		for (const dependency of module.dependencies) {
			if (dependency instanceof ExternalModule || dependency.id in modulesVisitedForCurrentEntry) {
				continue;
			}
			modulesVisitedForCurrentEntry[dependency.id] = dependency;
			if (dependency.id !== currentEntry.id && !dependency.chunkAlias)
				addCurrentEntryColourToModule(dependency);
		}

		// for (const { resolution } of module.dynamicImports) {
		// 	if (
		// 		resolution instanceof Module &&
		// 		resolution.dynamicallyImportedBy.length > 0 &&
		// 		!resolution.chunkAlias
		// 	) {
		// 		dynamicImports.push(resolution);
		// 	}
		// }
	};

	// handledEntryPoints[currentEntry.id] = true;
	modulesVisitedForCurrentEntry = { [currentEntry.id]: currentEntry };
	addCurrentEntryColourToModule(currentEntry);

	return Object.values(modulesVisitedForCurrentEntry);

	// for (currentEntry of dynamicImports) {
	// 	if (handledEntryPoints[currentEntry.id]) {
	// 		continue;
	// 	}
	// 	handledEntryPoints[currentEntry.id] = true;
	// 	currentEntryHash = randomUint8Array(10);
	// 	modulesVisitedForCurrentEntry = { [currentEntry.id]: null };
	// 	addCurrentEntryColourToModule(currentEntry);
	// }
}
