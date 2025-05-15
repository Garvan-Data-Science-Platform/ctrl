{
  inputs = {
    # pin a version of nixos-unstable that has node_22
    nixpkgs.url = "github:NixOS/nixpkgs/423d2df5b04b4ee7688c3d71396e872afa236a89";
    # nixpkgs.url = "github:NixOS/nixpkgs/3492680c7307336670aa778f4ff796459d4f24a6";
    systems.url = "github:nix-systems/default";
  };

  outputs = {
    systems,
    nixpkgs,
    ...
  } @ inputs: let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (
        system:
          f nixpkgs.legacyPackages.${system}
      );
  in {
    devShells = eachSystem (pkgs: let
    
      # Read the .nvmrc file and trim whitespace
      nvmrcContent = builtins.readFile ./.nvmrc;
      nodeVersion = builtins.replaceStrings ["\n" " "] ["" ""] nvmrcContent;
      
      # Function to get the appropriate nodejs package
      getNodejs = version:
        let
          # Strip any 'v' prefix if present (nvmrc sometimes has format "v16.14.0")
          cleanVersion = builtins.replaceStrings ["v"] [""] version;
          
          # Extract major version
          majorVersion = builtins.head (builtins.split "\\." cleanVersion);
          
          # Determine the appropriate nodejs package
          nodejsAttr = "nodejs_${majorVersion}";
        in
          if builtins.hasAttr nodejsAttr pkgs
          then pkgs.${nodejsAttr}
          else throw "Unsupported Node.js version: ${version}. Check if this version is available in your pinned nixpkgs.";
          
      nodejs = getNodejs nodeVersion;

    in {
    
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_22

          # You can choose pnpm, yarn, or none (npm).
          #pkgs.nodePackages.pnpm
          pkgs.yarn-berry

          pkgs.nodePackages.typescript
          pkgs.nodePackages.typescript-language-server
        ];
      };
    });
  };
}
