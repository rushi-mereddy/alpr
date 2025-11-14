import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    // <LinkStyled href="/">
     <>
       <h1>VISUM</h1>
     </>
      
    // </LinkStyled>
  );
};

export default Logo;
