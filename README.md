![Frame 3](https://github.com/nthumodifications/courseweb/assets/74640729/223a4560-0474-4b04-bdd8-566a192b2bad)

國立清華大學非公式的開源預排，選課，課表網站.   
The unofficial open-source course preselection, timetable builder, and course catalog website!

We are a passionate team of students dedicated to improving the technological standards of NTHU through students. We hope that with our efforts and yours, we'll make NTHU great again!

> **Note**
> This Repository is under heavy development, expect to have breaking changes!

## Usage
Currently, everyone can access the website at [NTHUMods](https://nthumods.com). If theres any issues/features you would like to see, feel free to open an issue [here](https://github.com/nthumodifications/courseweb/issues/new/choose).

## Development
You can clone the repository and start the development server via `npm run dev`

If you wish to participate in this development, feel free to email [nthumods@googlegroups.com](mailto:nthumods@googlegroups.com) in the meantime while we figure out the system for contributing.

## Deployment
We are currently using [Vercel](https://vercel.com) to deploy our website. If you wish to deploy your own version, you can do so by forking this repository and deploying it on Vercel. You will need to set up the following environment variables:


.env.local
```
CWA_API_KEY=
NEXTAUTH_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
NTHU_OAUTH_SECRET_KEY=
STUDENT_ID_PRIVATE_KEY=
STUDENT_ID_PUBLIC_KEY=
GOOGLE_SERVICE_KEY=<base64 of google service account file>
```


## Contributors
- [Chew Tzi Hwee](@ImJustChew)
- [Joshua Lean](@Joshimello)


## Inspiration
[NUSMods](https://nusmods.com) - The National University of Singapore's Website. The obvious lack of spirit in NTHU's website is what inspired us to create this project.
