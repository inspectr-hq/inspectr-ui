declare module "@inspectr/ui" {

    export interface InspectrAppProps {
        sseUrl?: string;
    }

    export const InspectrApp: React.FC<InspectrAppProps>;
}
