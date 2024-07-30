export var MODEL = {
  STARCARD:{
    modelConfig:{
      frequency_penalty: 0,
      max_tokens:4000,
      model:"gpt-4o",
      presence_penalty: 0,
      stream: false,
      temperature:0,
      top_p:0,
    },
    context:[
      {
        role:"user",
        content:[
          {
            text:'',
            type:"text"
          },
          {
            image_url:{
              url:''
            },
            type:"image_url"
          }
        ]
      }
    ]
  },
}