type MaybePromise<T> = T | Promise<T>;

type FormDataMap<T> = Map<T, any | null>;

type Validate<T> = (
    value: any | null,
    form: FormDataMap<T>
) => MaybePromise<any | void>;
type Not<T, A> = T extends A ? never : T;

type FieldRecord<T> = Record<string, Validate<T>>;

type ErrorRecord<F extends FieldRecord<string> | FieldRecord<never>> = {
    [FieldName in keyof F]: ReturnType<F[FieldName]>;
};

export class Form<Fields extends FieldRecord<never> = {}> {
    private fields: Fields;
    constructor(fields?: Fields) {
        this.fields = fields || ({} as Fields);
    }
    public field = <FieldName extends string, V extends Validate<keyof Fields | FieldName>>(
        fieldName: Not<FieldName, keyof Fields>,
        validate: V
    ) => {
        this.fields[fieldName] = validate as any;
        return this as any as Form<Fields & Record<FieldName, V>>;
    };
    public validate = async (formData: FormData) => {
        const errors: Record<string, any> = {};
        const formDataMap = new Map(formData.entries()) as FormDataMap<any>;
        for (const [fieldName, validate] of Object.entries(this.fields)) {
            const formValue = formData.get(fieldName);
            const result = await validate(formValue, formDataMap as any);
            if (result === undefined) continue;
            errors[fieldName] = result;
        }
        if (Object.keys(errors).length > 0)
            return errors as ErrorRecord<Fields>;
        return null;
    };
}