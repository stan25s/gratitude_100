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

import { useState, useEffect } from "react";

const [prompts, setPrompts] = useState([]);
const [leftCardPrompts, setLeftCardPrompts] = useState(null);

const pngImages = import.meta.glob('./assets/*.png', { eager: true, import: 'default' })

useEffect(() => {
  async function fetchPromptForUser() {
    try {
      const userID = "1";
      const response = await fetch(backend api);
      if (!response.ok) throw new Error('Failed to fetch prompts');
      const data = await response.json();
      setLeftCardPrompts(data.prompt);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  }
fetchPromptForUser();
}, []);
export default function Page() {
  const backgroundImage = pngImages['./assets/Background day 1 - 15.png'];
  const [leftCardText, setLeftCardText] = useState("");
  async function handleSubmit() {
    try {
      const response = await fetch('http://ronin-1:4000/entries', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: leftCardText })
      });
      if (response.ok) throw new Error('Failed to submit reflection');

      alert("Reflection submitted successfully!");
      setLeftCardText("");
    } catch (error) {
      console.error("Error submitting reflection:", error);
      alert("Error submitting reflection.");
    }
  }

  return (
    <Box 
        alignItems="center" 
        fontSize="xl" 
        minH ="100vh" 
        display="flex" 
        justifyContent="space-between"
        px="25px"
        py="25px"
        bgImage={backgroundImage ? `url(${backgroundImage})` : undefined}
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="center"
       > 
       {/* left card*/}
      <Card.Root
        borderRadius="md"
        bg="whiteAlpha.800"
        textAlign="center"
        width="48%"
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
        <Card.Header> 
          {leftCardPrompts ? leftCardPrompts : "Loading Prompt..."} </Card.Header>
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
            value={leftCardText}
            onChange={(e) => setLeftCardText(e.target.value)}
          />
          <Button mt={4} colorScheme="blue" onClick={handleSubmit}>
            Submit 
          </Button>  
        </Field.Root>
        </Card.Root>

          {/* right card*/}
        <Card.Root
        borderRadius="md"
        bg="whiteAlpha.800"
        textAlign="center"
        width="48%"
        height="100vh"
        color="black"
        fontFamily="'Patrick Hand', cursive"
        >
          <Card.Header> Your previous entries </Card.Header>
        </Card.Root>
      </Box>
  )
}