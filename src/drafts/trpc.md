---
layout: $/layouts/post.astro
title: The new t3 stack
description: 'Review of the main points of t3 stack, incluiding pros and cons'
author: Jesus
tags:
  - trpc
  - nextjs
date: 2022-10-13T00:00:00.000Z
pubDate: 2022-10-13T00:00:00.000Z
---

# T3 stack first steps

> A blog is just like having a long conversation with people, so it should make sense that things you enjoy talking about will be closely related to your passion.

<!-- ## Intro -->

<!-- -   A promise statement
-   A preview of what's to come -->

There are lots of opinionanted ways of do things nowdays. From Apollo graphql to NextJs
There are plenty of ways to build fullstack apps nowdays with different kind of tech      stacks and i a los of flavors

Today we will try to dive into the [T3 stack](https://init.tips/#why) and basically is a starting point to build a fully typescript app (frontend and backend)

<!-- ## Overview -->

-   A simple definition
-   So as stated in their [github repo](https://github.com/t3-oss/create-t3-app#about)

> *"(...)The "T3 Stack" is a web development stack made by Theo focused on simplicity, modularity, and full-stack typesafety(...)"*
>


    💡 Next.js + tRPC + Tailwind CSS + Typescript + Prisma + NextAuth


  To start developing with the t3 stack you can use the cli


![](https://upww.screenrec.com/images/f_NSO8uUQ0mwPxaTYtEk2RBJcMgynjADe9.png)

-   Examples
-   Transition to the next section

<!-- ## Steps -->

  First you are going to be asked about your project name and if you prefer javascript or typescript. Then you are going to be able to select the following optional technologies

  - nextAuth
  - prisma
  - tailwind
  - trpc

  As a software engineer, I am often asked which testing tools are the best to use. The answer to this question depends on the specific requirements of the project. There are many testing tools available, and the best one to use will be determined by the project requirements. T3 create app does not prescribe or recommend anything in this regard, so we must choose which testing tools to use based on our specific requirements. When selecting a toolset, consider the type of software being tested, the project budget, and the timeline for completion.

  For the sake of this article, we are going to select all of the tools in the list.
  
  ![](https://upww.screenrec.com/images/f_RtaV1ZzoF8Ii3W7cYqQl5A6MXEuNdygh.png)

  So the basic folder structure is as follows

  ![](https://upww.screenrec.com/images/f_1O4fqujDWBFU3naMh9pbiJmINL2T8lXe.png)

  - Inside `pages/api` folder is where you can find the `/trpc` subfolder where you are going to find the initizialization of the api handlers with the usage of nextjs dynamic routes ([trpc].ts)
  - `server` folder will contain the boilerplate for the trpc router, and in `utils/trpc` you will find helper types to query resolvers 

  

  ```
  T
   .
├── prisma # <-- if prisma is added
│   └── [..]
├── src
│   ├── pages
│   │   ├── _app.tsx # <-- add `withTRPC()`-HOC here
│   │   ├── api
│   │   │   └── trpc
│   │   │       └── [trpc].ts # <-- tRPC HTTP handler
│   │   └── [..]
│   ├── server
│   │   ├── routers
│   │   │   ├── app.ts   # <-- main app router
│   │   │   ├── post.ts  # <-- sub routers
│   │   │   └── [..]
│   │   ├── context.ts      # <-- create app context
│   │   └── createRouter.ts # <-- router helper
│   └── utils
│       └── trpc.ts  # <-- your typesafe tRPC hooks
└── [..]

    /*Source: trpc docs*/
  ```


> 💡 You can find the complete folder structure suggenstion in the [trpc docs](https://trpc.io/docs/v10/nextjs)


In `createRouter.ts` you will define the creation of the router for trpc so you can start merging the rrouter in the main app router that in this case is inside `server/routers/app.ts`

Inside the `server/routers` you could start defining your router methods for specific entities as in the `post.ts` example.

The `context.ts` is also important because here we define all the objects that are going to be available in every api call, like for example the session object, to check if a user is authenticated/authorized, or the prisma client, so you we can access the data through prisma.

Finally to add trpc to you nextjs app, you would need to wrap you entry point with the `withTRPC` HOC. The HOC has a config callback that is going to be very importanto to make custom customizations about the API url, or the react-query configuration that internally is used by tRPC react hooks.

For example this is how a router would look like in the `server/routers` 

``` javascript
import { Prisma, CandidateRecruiterLink } from '@prisma/client';
import {
  createLinkSchema,
  verifyLinkSchema,
  verifyLinkUsageResponseSchema,
  verifyLinkUsageSchema,
} from '../../../schema/link.schema';
import { createRouter } from '../createRouterContext';

export const linkRouter = createRouter()
  .mutation('create-link', {
    input: createLinkSchema,
    async resolve({ ctx, input }) {
      const link = await ctx.prisma.candidateRecruiterLink.create({
        data: {
          minSalary: input.minSalary,
          isAnual: input.salaryPeriod === 'anual',
          isNetSalary: input.salaryType === 'net',
          currency: input.salaryCurrency,
          comment: input.comment,
        },
      });

      return link;
    },
  })
  .mutation('verify-link', {
    input: verifyLinkSchema,
    async resolve({ ctx, input }) {
      console.log('🚀 ~ file: link.router.ts ~ line 30 ~ resolve ~ input', {
        input,
      });

      const link = await ctx.prisma.candidateRecruiterLink.findFirst({
        where: {
          matchId: input.slug,
        },
      });

      console.log({ link });

      const maxSalary = new Prisma.Decimal(input.maxSalary);
      let isMatch = false;
      if (link) {
        await ctx.prisma.candidateRecruiterLink.update({
          where: {
            matchId: input.slug,
          },
          data: { maxSalary },
        });
        isMatch = maxSalary >= link.minSalary;
      }
      return {
        isMatch,
        maxSalary: input.maxSalary,
        minSalary: link?.minSalary || 0,
      };
    },
  })
  .query('verify-link-usage', {
    input: verifyLinkUsageSchema,
    async resolve({ ctx, input }) {
      const link = await ctx.prisma.candidateRecruiterLink.findFirst({
        where: {
          matchId: input.slug,
        },
      });

      console.log({ link });

      let alreadyUsed = false;
      if (link?.maxSalary) {
        alreadyUsed = true;
      }

      return {
        currency: link?.currency,
        salaryType: link?.isNetSalary ? 'Net' : 'Gross',
        salaryPeriod: link?.isAnual ? 'Anual' : 'Monthly',
        alreadyUsed,
      };
    },
  });

```

The magic here is that you can define schemas to type the API endpoints and also to have those types available through all our monorepo.


> 🧙‍♂️  Full static typesafety & autocompletion on the client, for inputs, outputs and errors. - tRPC docs

``` javascript
import z from 'zod';
import { CandidateRecruiterLink } from '@prisma/client';

export const createLinkSchema = z.object({
  minSalary: z.number().min(0),
  salaryType: z.enum(['gross', 'net']),
  salaryPeriod: z.enum(['anual', 'monthly']),
  salaryCurrency: z.enum(['USD', 'EUR', 'GBP']),
  comment: z.string(),
  slug: z.string(),
});

export type CreateLinkInput = z.TypeOf<typeof createLinkSchema>;

export const getSingleLinkSchema = z.object({
  linkId: z.string().cuid(),
});

export const verifyLinkSchema = z.object({
  maxSalary: z.number(),
  slug: z.string(),
});

export const verifyLinkUsageSchema = z.object({
  slug: z.string(),
});

export const verifyLinkUsageResponseSchema = z.object({
  alreadyUsed: z.string(),
  isNetSalary: z.boolean(),
  isAnual: z.boolean(),
  currency: z.string(),
  comment: z.string(),
  slug: z.string().nullish(),
});
```



<!-- # Conclusion -->

So this is a first view of tRPC and the very basics of what you can accomplish a fullstack app with the T3 stack.

It's important that the T3 stack is awesome to start a project and save time with the initial setup of a fully typed app.


<!-- 
    - Reminder of how helpful the guide is 
    - Reiterate how important your topic is
    - Call-to-action
--->


I would recommend the following tutorials if you want to learn more about trpc

- [tRPC: Smart and Easy APIs](https://www.youtube.com/watch?v=Lam0cYOEst8)
- [Build a Blog With the T3 Stack - tRPC, TypeScript, Next.js, Prisma & Zod](https://www.youtube.com/watch?v=syEWlxVFUrY&t=1389s)

<!-- 
# Checklist

Inspiration ⛅

-   Read articles and watch videos that inspire me
-   Brainstorm the topics that I want to write about in bullet points
-   Reorder those bullet points to create a line of thought

Draft ✏️

-   Expand those bullet points into sentences/text
-   Go over the document

Ready to Publish 🌐

-   Draft 5 titles and pick one
-   Revise the complete text for typos
-   Preview the text
-   Publish or schedule the post
-   Promote on social media

-->

