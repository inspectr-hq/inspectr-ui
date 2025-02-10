declare module "@request-inspector/ui" {

    export interface InspectorAppProps {
        sseUrl?: string;
    }

    export const InspectorApp: React.FC<InspectorAppProps>;
}
