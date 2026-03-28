import {
  Box,
  Button,
  Checkbox,
  ClientOnly,
  HStack,
  Heading,
  Progress,
  RadioGroup,
  Skeleton,
  VStack,
  Card,
  Field,
  Textarea
} from "@chakra-ui/react"

const pngImages = import.meta.glob('./assets/*.png', { eager: true, import: 'default' })

export default function Page() {
  const backgroundImage = pngImages['./assets/Background day 1 - 15.png'];

  return (
    <Box 
        alignItems="center" 
        fontSize="xl" 
        minH ="100vh" 
        display="flex" 
        justifyContent="flex-start"
        px="25px"
        py="25px"
        bgImage={backgroundImage ? `url(${backgroundImage})` : undefined}
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="center"
       > 
      <Card.Root
        borderRadius="md"
        bg="whiteAlpha.800"
        textAlign="center"
        width="50%"
        height="100vh"
        color="black"
        fontFamily="'Patrick Hand', cursive"
        sx={{
          "@media (orientation: portrait)": {
            height: "100vh",
            width: "100%"
          }
        }}
      > 
        <Card.Header> Temp text for before backend connection </Card.Header>
        <Field.Root 
          display="flex"
          flexDirection="column"
          alignItems="center"> 
          <Field.Label> Write your reflections here! </Field.Label>
          <Textarea 
            placeholder="Write your reflections here!"
            size="lg"
            height="200px"
            width="80%"
          />
        </Field.Root>
        </Card.Root>
      </Box>
  )
}