import { chestBodyPart } from './hps/chestBodyPart';

function getHangingProtocolModule() {
  return [
    {
      name: chestBodyPart.id,
      protocol: chestBodyPart,
    },
  ];
}

export default getHangingProtocolModule;
