
export default function SingletonPattern<T>() {
    class SingletonPattern {
        protected constructor() { };
        protected static instance: SingletonPattern = null;

        public static get ins(): T {
            if (!SingletonPattern.instance) {
                SingletonPattern.instance = new this();
            }
            return SingletonPattern.instance as T;
        }

        public static set ins(v) {
            if (!v) {
                delete SingletonPattern.instance;
            }
            SingletonPattern.instance = v;
        }
    }
    return SingletonPattern;
}


