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
    devShells = eachSystem (pkgs: {
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
