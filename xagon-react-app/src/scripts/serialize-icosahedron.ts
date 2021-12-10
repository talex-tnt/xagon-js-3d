// eslint-disable-next-line no-console
// import * as fs from 'fs';
import Icosahedron from '../models/Icosahedron';
import JsonIcosahedronSerializer from '../serializers/JsonIcosahedronSerializer';
import _1to4SubdivisionStrategy from '../models/Icosahedron/SubdivisionStrategy/1to4SubdivisionStrategy';
import { k_icosahedronJsonFilename } from '../constants/identifiers';

// eslint-disable-next-line no-console
console.log('Serializing Icosahedron');

const subdivisionStrategy = new _1to4SubdivisionStrategy();
const icosahedron = new Icosahedron({ subdivisionStrategy });
icosahedron.subdivide(2);
const serializer = new JsonIcosahedronSerializer();
const writeBuffer = serializer.serialize(icosahedron);
// eslint-disable-next-line no-console
console.log('Icosahedron', writeBuffer);

// fs.writeFileSync(k_icosahedronJsonFilename, writeBuffer);
