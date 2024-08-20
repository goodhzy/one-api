import React from "react";
import { PackageVariant } from "mdi-material-ui";
import { styled } from "@mui/material/styles";

// Styled components
const EmptyContainer = styled('div')(({ theme }) => ({
    bottom: "0",
    color: theme.palette.action.disabled,
    textAlign: "center",
    paddingTop: "20px",
}));

const EmptyInfoBig = styled('div')(({ theme }) => ({
    fontSize: "25px",
    color: theme.palette.action.disabled,
}));

const EmptyInfoSmall = styled('div')(({ theme }) => ({
    color: theme.palette.action.disabled,
}));

export default function Nothing({ primary, secondary, top = 20, size = 1 }) {
    return (
      <EmptyContainer
        style={{
            margin: `${50 * size}px auto`,
            paddingTop: top,
        }}
      >
          <PackageVariant
            style={{
                fontSize: 160 * size,
            }}
          />
          <EmptyInfoBig
            style={{
                fontSize: 25 * size,
            }}
          >
              {primary}
          </EmptyInfoBig>
          {secondary !== "" && (
            <EmptyInfoSmall>{secondary}</EmptyInfoSmall>
          )}
      </EmptyContainer>
    );
}
