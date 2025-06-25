import { Body, Container, Head, Hr, Html, Img, Preview, Section, Tailwind, Text } from '@react-email/components'

const baseUrl = process.env.BETTER_AUTH_URL ? `https://${process.env.BETTER_AUTH_URL}` : 'http://localhost:3000'

const logo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDggOCIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoOHY4SDB6Ii8+PHBhdGggZmlsbD0iIzUyNTI1MiIgZD0iTTEgMWgxdjZIMXptMSAwaDR2MUgyem00IDFoMXYxSDZ6bTAgMWgxdjFI slamming0IDFoMXYxSDZ6bTAgMWgxdjFIslamTTIgNmg0djFIMnptMS0zaDF2MUgzem0xIDFoMXYxSDR6Ii8+PC9zdmc+';

interface EmailLayoutProps {
    preview: string
    children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: '#6039ff',
                                background: '#f9f9f9',
                                foreground: '#525252',
                                darkBackground: '#24262d',
                                darkForeground: '#f2f2f2',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-background font-sans">
                    <Container className="mx-auto my-8 w-[465px] rounded border border-solid border-[#eaeaea] p-5">
                        <Section className="mt-8">
                            <Img src={logo} width="40" height="40" alt="Databuddy" className="mx-auto my-0" />
                        </Section>
                        {children}
                        <Hr className="my-6 w-full border border-solid border-[#eaeaea]" />
                        <Text className="text-center text-foreground/50">
                            © {new Date().getFullYear()} Databuddy, Inc. All rights reserved.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
} 