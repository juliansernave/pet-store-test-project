import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import swagger from '../tests/fixtures/petstore-swagger.json';

type SwaggerDoc = { definitions: Record<string, object> };
const doc = swagger as unknown as SwaggerDoc;

export type DefinitionName = keyof typeof swagger.definitions & string;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(doc, 'petstore-swagger');

const validators = new Map<string, ValidateFunction>();

function getValidator(name: string): ValidateFunction {
  let v = validators.get(name);
  if (!v) {
    if (!doc.definitions[name]) {
      throw new Error(`Unknown swagger definition: ${name}. Available: ${Object.keys(doc.definitions).join(', ')}`);
    }
    v = ajv.compile({ $ref: `petstore-swagger#/definitions/${name}` });
    validators.set(name, v);
  }
  return v;
}

export function validateAgainstSchema(body: unknown, definitionName: DefinitionName): { valid: boolean; errors: string | null } {
  const validate = getValidator(definitionName);
  const valid = validate(body);
  return { valid, errors: valid ? null : ajv.errorsText(validate.errors, { separator: '\n  - ' }) };
}
