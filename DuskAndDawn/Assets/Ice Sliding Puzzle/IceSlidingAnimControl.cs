using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class IceSlidingAnimControl : MonoBehaviour
{
    IceSlideMetadata metadata;
    Animator _anim;
    void Start()
    {
        metadata = GameObject.FindObjectOfType<IceSlideMetadata>();
        _anim = gameObject.GetComponent<Animator>();
    }

    // Update is called once per frame
    void Update()
    {
        if (gameObject.tag == metadata.curPlayer.name)
        {
            _anim.SetBool("isCurPlayer", true);
        }
        else
        {
            _anim.SetBool("isCurPlayer", false);
        }
    }
}
